'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { matchingApi } from '@/lib/matching.api';
import { useAuthStore } from '@/store/auth';
import { toast } from 'react-hot-toast';
import { Sparkles, TrendingUp, Package, Leaf, MapPin, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchCard } from '@/components/matching/MatchCard';
import Link from 'next/link';

const exchangeTypes = ['Tous', 'Don', 'Troc', 'Revente', 'Mobile', 'Immobilier'];

export default function MatchingPage() {
  const { isAuthenticated } = useAuthStore();
  const [selectedExchangeType, setSelectedExchangeType] = useState('Tous');
  const queryClient = useQueryClient();

  // Récupérer les recommandations
  const {
    data: recommendationsData,
    isLoading: recommendationsLoading,
    error: recommendationsError,
    refetch: refetchRecommendations,
  } = useQuery({
    queryKey: ['matching-recommendations'],
    queryFn: () => matchingApi.getRecommendations({ limit: 20 }),
    enabled: isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const handleRefreshRecommendations = () => {
    refetchRecommendations();
  };

  // Données mock pour les statistiques (à remplacer par l'API)
  const stats = {
    averageCompatibility: 78,
    compatibleItems: 124,
    co2Saved: '–45 kg',
    averageDistance: '12 km',
  };

  // Données mock pour les items (à remplacer par l'API)
  const items = recommendationsData?.recommendations?.map((rec) => ({
    id: rec.item.id,
    image: rec.item.photos?.[0] || '/placeholder-item.jpg',
    title: rec.item.title,
    category: rec.item.category,
    condition: rec.item.condition,
    location: rec.item.location || 'Paris, France',
    compatibilityScore: rec.score,
  })) || [];

  const filteredItems =
    selectedExchangeType === 'Tous'
      ? items
      : items.filter((item) => item.category === selectedExchangeType);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0b0d]">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <Sparkles className="mx-auto mb-4 h-16 w-16 text-[#10b981]" />
            <h1 className="mb-2 text-2xl font-bold text-[#0b0b0d] dark:text-[#ededee]">
              Connexion requise
            </h1>
            <p className="mb-6 text-[#71717a] dark:text-[#a1a1aa]">
              Connectez-vous pour accéder à vos recommandations personnalisées
            </p>
            <Button asChild className="bg-[#10b981] hover:bg-[#10b981]/90">
              <Link href="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0b0b0d]">
      {/* Hero Section - Design Figma */}
      <section className="relative overflow-hidden border-b border-[#e4e4e7] bg-gradient-to-b from-[rgba(16,185,129,0.1)] via-[#fafafa] via-50% to-[#fafafa] dark:border-[#27272a] dark:via-[#0b0b0d] dark:to-[#0b0b0d]">
        <div className="mx-auto w-full max-w-[1095px] px-4 pb-0 pt-20 lg:px-[179.5px]">
          <div className="mx-auto w-full max-w-[736px] text-center">
            {/* Badge */}
            <div className="mb-[54px] inline-flex h-[38px] items-center gap-2 rounded-full border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.1)] px-4">
              <Sparkles className="h-4 w-4 text-[#10b981]" />
              <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#10b981]">
                Matching intelligent par IA
              </span>
            </div>

            {/* Titre principal */}
            <h1 className="mb-4 text-[48px] leading-[48px] tracking-[0.3516px] text-[#0b0b0d] dark:text-[#ededee]">
              Trouvez les échanges
              <br />
              <span className="text-[#10b981]">qui vous correspondent</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-0 max-w-[672px] text-[20px] leading-[28px] tracking-[-0.4492px] text-[#71717a] dark:text-[#a1a1aa]">
              Notre intelligence artificielle analyse vos préférences pour vous
              proposer les objets les plus adaptés à vos besoins
            </p>
          </div>
        </div>
      </section>

      {/* Section Statistiques - Design Figma */}
      <section className="mx-auto w-full max-w-[1095px] px-4 py-16 lg:px-[179.5px]">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Carte Compatibilité moyenne */}
          <div className="rounded-[14px] border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[rgba(16,185,129,0.1)]">
                <TrendingUp className="h-5 w-5 text-[#10b981]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                  Compatibilité moyenne
                </span>
                <span className="text-[24px] leading-[32px] tracking-[0.2637px] text-[#0b0b0d] dark:text-[#ededee]">
                  {stats.averageCompatibility}%
                </span>
              </div>
            </div>
          </div>

          {/* Carte Objets compatibles */}
          <div className="rounded-[14px] border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[rgba(43,127,255,0.1)]">
                <Package className="h-5 w-5 text-[#51a2ff]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                  Objets compatibles
                </span>
                <span className="text-[24px] leading-[32px] tracking-[0.2637px] text-[#0b0b0d] dark:text-[#ededee]">
                  {stats.compatibleItems}
                </span>
              </div>
            </div>
          </div>

          {/* Carte CO₂ évité estimé */}
          <div className="rounded-[14px] border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[rgba(0,201,80,0.1)]">
                <Leaf className="h-5 w-5 text-[#05df72]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                  CO₂ évité estimé
                </span>
                <span className="text-[24px] leading-[32px] tracking-[0.2637px] text-[#0b0b0d] dark:text-[#ededee]">
                  {stats.co2Saved}
                </span>
              </div>
            </div>
          </div>

          {/* Carte Distance moyenne */}
          <div className="rounded-[14px] border border-[#e4e4e7] bg-white p-6 dark:border-[#27272a] dark:bg-[#121216]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[rgba(240,177,0,0.1)]">
                <MapPin className="h-5 w-5 text-[#fdc700]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm leading-[20px] tracking-[-0.1504px] text-[#71717a] dark:text-[#a1a1aa]">
                  Distance moyenne
                </span>
                <span className="text-[24px] leading-[32px] tracking-[0.2637px] text-[#0b0b0d] dark:text-[#ededee]">
                  {stats.averageDistance}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Barre de filtres sticky - Design Figma */}
      <div className="sticky top-0 z-10 border-b border-[#e4e4e7] bg-[rgba(250,250,250,0.8)] backdrop-blur-sm dark:border-[#27272a] dark:bg-[rgba(11,11,13,0.8)]">
        <div className="mx-auto w-full max-w-[1095px] px-4 py-4 lg:px-[179.5px]">
          <div className="flex gap-3 overflow-x-auto">
            {exchangeTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedExchangeType(type)}
                className={`h-[32px] whitespace-nowrap rounded-full px-5 text-sm font-semibold leading-[20px] tracking-[-0.1504px] transition-colors ${
                  selectedExchangeType === type
                    ? 'bg-[#10b981] text-white'
                    : 'border border-[#e4e4e7] bg-[#fafafa] text-[#0b0b0d] hover:bg-[#f4f4f5] dark:border-[#1a1a1f] dark:bg-[rgba(26,26,31,0.3)] dark:text-[#ededee] dark:hover:bg-[rgba(26,26,31,0.5)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grille d'objets - Design Figma */}
      <section className="mx-auto w-full max-w-[1095px] px-4 py-16 lg:px-[179.5px]">
        {recommendationsLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-[24px]">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[360px] animate-pulse rounded-[14px] bg-[#e4e4e7] dark:bg-[#27272a]"
              />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-[24px]">
            {filteredItems.map((item) => (
              <MatchCard key={item.id} {...item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center text-[#71717a] dark:text-[#a1a1aa]">
            <Frown className="mb-4 h-12 w-12" />
            <p className="text-lg font-semibold">Aucun objet disponible</p>
            <p className="text-sm">
              Revenez plus tard ou ajustez vos filtres.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
