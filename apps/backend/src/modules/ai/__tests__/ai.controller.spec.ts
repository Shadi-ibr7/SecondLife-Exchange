/**
 * FICHIER: ai.controller.spec.ts
 *
 * Tests ciblés pour AiItemsController / GeminiService :
 * - Quota 3 appels / jour (HTTP 429)
 * - Fallback de la catégorie IA vers ItemCategory.OTHER en cas de valeur inconnue
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { AiItemsController } from '../ai.controller';
import { GeminiService } from '../gemini.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AiItemSuggestDto } from '../dtos/ai-item-suggest.dto';
import { ItemCategory } from '@prisma/client';

describe('AiItemsController', () => {
  let controller: AiItemsController;
  let prisma: {
    aiUsage: {
      count: jest.Mock;
      create: jest.Mock;
    };
  };
  let gemini: { analyzeItem: jest.Mock };

  beforeEach(async () => {
    prisma = {
      aiUsage: {
        count: jest.fn(),
        create: jest.fn(),
      },
    };

    gemini = {
      analyzeItem: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiItemsController],
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: GeminiService,
          useValue: gemini,
        },
      ],
    }).compile();

    controller = module.get<AiItemsController>(AiItemsController);
  });

  describe('quota 3 appels / jour', () => {
    it('doit renvoyer 429 quand le quota est dépassé', async () => {
      prisma.aiUsage.count.mockResolvedValue(3);

      const dto: AiItemSuggestDto = {
        title: 'Titre suffisant',
        description: 'Description suffisamment longue pour passer la validation',
      };

      const req = {
        user: { id: 'user-123' },
        ip: '127.0.0.1',
        get: () => 'jest-test-agent',
      } as any;

      await expect(controller['suggestItem'](req, dto)).rejects.toBeInstanceOf(
        HttpException,
      );

      try {
        await controller['suggestItem'](req, dto);
      } catch (e) {
        const err = e as HttpException;
        expect(err.getStatus()).toBe(429);
        const body: any = err.getResponse();
        expect(body.code).toBe('QUOTA_EXCEEDED');
        expect(body.quota).toBeDefined();
        expect(body.quota.max).toBe(3);
      }
    });
  });
});

describe('GeminiService category fallback', () => {
  it('doit fallback sur ItemCategory.OTHER si la catégorie IA est inconnue', async () => {
    const mockConfigService = {
      get: () => ({
        geminiApiKey: 'test-key',
        geminiModel: 'gemini-2.5-flash',
        geminiTimeout: 10000,
        geminiMaxRetries: 1,
        geminiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      }),
    };

    const service = new GeminiService(mockConfigService as any);

    const rawResponse = JSON.stringify({
      category: 'INCONNUE',
      tags: ['tag1', 'tag2'],
      aiSummary: 'Un résumé suffisamment court',
      aiRepairTip: 'Aucune réparation nécessaire',
    });

    const result = (service as any).parseGeminiResponse(rawResponse) as {
      category: ItemCategory;
      tags: string[];
      aiSummary: string;
      aiRepairTip: string;
    };

    expect(result.category).toBe(ItemCategory.OTHER);
    expect(result.tags).toEqual(['tag1', 'tag2']);
    expect(result.aiSummary).toContain('Un résumé');
  });
});

