import { app } from '@azure/functions';

import './functions/signup';
import './functions/login';
import './functions/verifyEmail';

app.setup({
    enableHttpStream: true,
});