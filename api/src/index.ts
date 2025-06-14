import { app } from '@azure/functions';

import './functions/signup';
import './functions/login';
import './functions/verifyEmail';
import './functions/update-user';
import './functions/protected-endpoint';

app.setup({
    enableHttpStream: true,
});