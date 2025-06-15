import { app } from '@azure/functions';

import './functions/signup';
import './functions/login';
import './functions/verifyEmail';
import './functions/update-user';
import './functions/protected-endpoint';
import './functions/create-department';
import './functions/create-category';
import './functions/get-department';
import './functions/create-subcategory';

app.setup({
    enableHttpStream: true,
});