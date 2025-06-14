import { app } from '@azure/functions';

import './functions/signup';
import './functions/login';
import './functions/verifyEmail';
import './functions/update-user';
import './functions/protected-endpoint';
import './functions/create-department';

app.setup({
    enableHttpStream: true,
});