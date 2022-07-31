import util from 'util';

import { initializeApp } from './app';
import { constants } from './constants';
import { initializeDatabase } from './db';
import { validateEnvValues } from './env';
import { ORIGIN, PORT } from './env';

validateEnvValues();
initializeDatabase();
const app = initializeApp();
app.listen(PORT, () => console.log(util.format(constants.log.serverStarted, PORT, ORIGIN)));
