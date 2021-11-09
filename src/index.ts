import util from 'util';

import { initilizeApp } from './app';
import { constants } from './constants';
import { initilizeDatabase } from './db';
import { validateEnvValues } from './env';
import { ORIGIN, PORT } from './env';

validateEnvValues();
initilizeDatabase();
const app = initilizeApp();
app.listen(PORT, () => console.log(util.format(constants.log.serverStarted, PORT, ORIGIN)));
