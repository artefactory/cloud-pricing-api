import ProgressBar from 'progress';
import config from '../config';
import emissionsCoef from '../data/emissions/coefficients.json';
import { PoolClient } from 'pg';

async function run(): Promise<void> {
  const pool = await config.pg();

  const client = await pool.connect();

  const progressBar = new ProgressBar(
    '-> loading [:bar] :percent (:etas remaining)',
    {
      width: 40,
      complete: '=',
      incomplete: ' ',
      renderThrottle: 500,
      total: Object.keys(emissionsCoef).length,
    }
  );

  // For each coefficient in the JSON file, update the corresponding products.
  config.logger.info('Updating product emissions');

  for (const [key, coefficient] of Object.entries(emissionsCoef)) {
    const [_, skuId, region] = key.split('_');
    await updateProductEmissions(client, skuId, region, coefficient);
    progressBar.tick();
  }
}

const updateProductEmissions = async (
  client: PoolClient,
  skuId: string,
  region: string,
  coefficient: number
): Promise<void> => {
  const emissionData = JSON.stringify([
    {
      emissionHash: 'emissionHash',
      unit: 'kgCO2e',
      emissions: coefficient,
      startUsageAmount: 0,
    },
  ]);

  await client.query(
    `
      UPDATE "products"
      SET "emissions" = $1
      WHERE "sku" = $2 AND "region" = $3
      `,
    [emissionData, skuId, region]
  );
};

config.logger.info('Starting: loading data into DB');
run()
  .then(() => {
    config.logger.info('Completed: loading data into DB');
    process.exit(0);
  })
  .catch((err) => {
    config.logger.error(err);
    process.exit(1);
  });
