import { app } from '@azure/functions';

import './functions/signup';

app.setup({
    enableHttpStream: true,
})