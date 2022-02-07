const INPUT_PATH = '/Users/thomas/mafft-ws/input/';
const OUTPUT_PATH = '/Users/thomas/mafft-ws/output/';

const NUM_THREADS = 1; // NUM_THREADS * NUM_CONCURRENT_PROCESSES should be equal to the number of cores available for this service
const NUM_CONCURRENT_PROCESSES = 8;
const env = process.env.NODE_ENV || 'local';
console.log('ENV: ' + env);

const config = {
  local: {
    INPUT_PATH: INPUT_PATH,
    OUTPUT_PATH: OUTPUT_PATH,
    NUM_THREADS: NUM_THREADS,
    NUM_CONCURRENT_PROCESSES: NUM_CONCURRENT_PROCESSES,
    EXPRESS_PORT: 9000
  },
  production: {
    INPUT_PATH: INPUT_PATH,
    OUTPUT_PATH: OUTPUT_PATH,
    NUM_THREADS: NUM_THREADS,
    NUM_CONCURRENT_PROCESSES: NUM_CONCURRENT_PROCESSES,
    EXPRESS_PORT: 80
  }
};

module.exports = config[env];
