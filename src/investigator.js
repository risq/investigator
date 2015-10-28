import transceiver from 'transceiver';

import Ui from './ui';
import agent from './agent';

transceiver.setPromise(null);

const ui = new Ui();

export default {ui, agent};
