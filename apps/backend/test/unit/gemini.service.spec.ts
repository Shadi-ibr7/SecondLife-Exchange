import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../../src/modules/ai/gemini.service';
import { ItemCategory } from '@prisma/client';

// Mock fetch
global.fetch = jest.fn();

describe('GeminiService', () => {
  let service: GeminiService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GeminiService>(GeminiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('analyzeItem', () => {
    it('devrait analyser un item avec succès', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    category: 'BOOKS',
                    tags: ['livre', 'cuisine', 'vintage'],
                    aiSummary: 'Livre de cuisine vintage en bon état',
                    aiRepairTip: 'Aucune réparation nécessaire',
                  }),
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.analyzeItem({
        title: 'Livre de cuisine',
        description: 'Livre de recettes traditionnelles',
      });

      expect(result).toEqual({
        category: ItemCategory.BOOKS,
        tags: ['livre', 'cuisine', 'vintage'],
        aiSummary: 'Livre de cuisine vintage en bon état',
        aiRepairTip: 'Aucune réparation nécessaire',
      });
    });

    it("devrait retourner null si la clé API n'est pas configurée", async () => {
      // Sauvegarder la variable d'environnement originale
      const originalEnv = process.env.AI_GEMINI_API_KEY;

      // Supprimer la variable d'environnement
      delete process.env.AI_GEMINI_API_KEY;

      // Créer un nouveau service avec une configuration sans clé API
      const mockConfigService = {
        get: jest.fn().mockReturnValue({
          geminiApiKey: null,
        }),
        internalConfig: {},
        isCacheEnabled: false,
        cache: new Map(),
        _changes$: null,
      } as any;

      const serviceWithoutKey = new GeminiService(mockConfigService);

      // Le service devrait retourner null si la clé API n'est pas configurée
      const result = await serviceWithoutKey.analyzeItem({
        title: 'Test Item',
        description: 'Test description',
      });

      expect(result).toBeNull();

      // Restaurer la variable d'environnement
      if (originalEnv) {
        process.env.AI_GEMINI_API_KEY = originalEnv;
      }
    });

    it("devrait gérer les erreurs de l'API Gemini", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      });

      const result = await service.analyzeItem({
        title: 'Test Item',
        description: 'Test description',
      });

      expect(result).toBeNull();
    });

    it('devrait gérer les timeouts', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 12000)), // Plus long que le timeout du service
      );

      const result = await service.analyzeItem({
        title: 'Test Item',
        description: 'Test description',
      });

      expect(result).toBeNull();
    }, 15000); // Timeout de 15 secondes pour ce test

    it('devrait valider la structure de la réponse JSON', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    category: 'INVALID_CATEGORY',
                    tags: ['tag1'],
                    aiSummary: 'Summary',
                    aiRepairTip: 'Tip',
                  }),
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.analyzeItem({
        title: 'Test Item',
        description: 'Test description',
      });

      expect(result).toBeNull();
    });

    it('devrait nettoyer les réponses avec markdown', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text:
                    '```json\n' +
                    JSON.stringify({
                      category: 'ELECTRONICS',
                      tags: ['smartphone', 'apple'],
                      aiSummary: 'iPhone en bon état',
                      aiRepairTip: 'Aucune réparation nécessaire',
                    }) +
                    '\n```',
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.analyzeItem({
        title: 'iPhone 12',
        description: 'Smartphone Apple',
      });

      expect(result).toEqual({
        category: ItemCategory.ELECTRONICS,
        tags: ['smartphone', 'apple'],
        aiSummary: 'iPhone en bon état',
        aiRepairTip: 'Aucune réparation nécessaire',
      });
    });
  });

  describe('testConnection', () => {
    it('devrait tester la connexion avec succès', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    category: 'OTHER',
                    tags: ['test'],
                    aiSummary: 'Test',
                    aiRepairTip: 'Test',
                  }),
                },
              ],
            },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.testConnection();

      expect(result).toBe(true);
    });

    it("devrait retourner false en cas d'erreur", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const result = await service.testConnection();

      expect(result).toBe(false);
    });
  });
});
