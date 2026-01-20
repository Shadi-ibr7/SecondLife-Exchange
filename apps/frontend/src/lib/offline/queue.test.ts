import { enqueueJob, getJobsByType, getJobsByStatus, updateJob } from './queue';

describe('offline queue', () => {
  it('enregistre un job et le retrouve par type/statut', async () => {
    const job = await enqueueJob('ECO_CREATE', { title: 't', url: 'https://x.test' });

    const byType = await getJobsByType('ECO_CREATE');
    expect(byType.some((j) => j.id === job.id)).toBe(true);

    const pending = await getJobsByStatus(['PENDING']);
    expect(pending.some((j) => j.id === job.id)).toBe(true);

    await updateJob(job.id, { status: 'FAILED', error: 'boom' });
    const failed = await getJobsByStatus(['FAILED']);
    expect(failed.find((j) => j.id === job.id)?.error).toBe('boom');
  });
});

