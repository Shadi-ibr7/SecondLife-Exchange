import { registerAs } from '@nestjs/config';

export default registerAs('schedule', () => ({
  cron: process.env.SCHEDULE_CRON || '0 23 * * 0', // Dimanche 23:00 par défaut
  timezone: process.env.SCHEDULE_TZ || 'Europe/Paris',
  maxSuggestionsPerRun: parseInt(process.env.SUGGESTIONS_MAX_PER_RUN || '20'),
  maxSuggestionsPerCountry: parseInt(
    process.env.SUGGESTIONS_MAX_PER_COUNTRY || '2',
  ),
  maxSuggestionsPerEra: parseInt(process.env.SUGGESTIONS_MAX_PER_ERA || '2'),
  lookbackWeeks: parseInt(process.env.SUGGESTIONS_LOOKBACK_WEEKS || '12'),
}));
