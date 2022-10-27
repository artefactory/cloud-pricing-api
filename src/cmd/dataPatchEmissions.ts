import ProgressBar from 'progress';
import config from '../config';
import { PoolClient } from 'pg';

const batchSize = 10000;

async function run(): Promise<void> {
    const pool = await config.pg();

    const client = await pool.connect();
    try {
        // Fetch all product hashes
        config.logger.info('Fetching all product hashes');
        const productHashes = await getProductHashes(client);

        const progressBar = new ProgressBar(
            '-> loading [:bar] :percent (:etas remaining)',
            {
              width: 40,
              complete: '=',
              incomplete: ' ',
              renderThrottle: 500,
              total: productHashes.length,
            }
          );

        // For each product hash, insert by batch the emissions data into the product table
        config.logger.info('Updating product emissions');
        for (let i = 0; i < productHashes.length; i += batchSize) {
            const batch = productHashes.slice(i, i + batchSize);

            await client.query('BEGIN');

            await Promise.all(batch.map((productHash) => {
                updateProductEmissions(client, productHash);
                progressBar.tick();
            }));

            await client.query('COMMIT');
        }

        // await setEmissionsUpdateSuccessful(client);
    } catch (e) {
        await client.query('ROLLBACK');

        // await setEmissionsUpdateFailed(client);

        throw e;
    }

}

async function getProductHashes(client: PoolClient): Promise<string[]> {
    const result = await client.query(
        `
        SELECT "productHash"
        FROM "products"
        `
    );

    return result.rows.map((row) => row.productHash);
}

async function updateProductEmissions(client: PoolClient, productHash: string): Promise<void> {
    const emissionsData = generateEmissionsData();
    await client.query(
        `
        UPDATE "products"
        SET "emissions" = $1
        WHERE "productHash" = $2
        `,
        [emissionsData, productHash]
    );
}

const generateEmissionsData = () => {
    return JSON.stringify([{
        emissionHash: 'SampleEmissionHash',
        unit: 'kgeqCO2',
        CO2e: Math.random() * 100,
        effectiveDateStart: '2020-01-01',
        effectiveDateEnd: '2024-12-31',
        startUsageAmount: 0,
        endUsageAmount: 100,
        description: 'Sample Description',
    }]);
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