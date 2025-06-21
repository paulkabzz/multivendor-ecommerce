import { app } from '@azure/functions';

import './functions/signup';
import './functions/login';
import './functions/verifyEmail';
import './functions/update-user';
import './functions/create-department';
import './functions/create-category';
import './functions/get-department';
import './functions/create-subcategory';
import './functions/delete-user';
import './functions/create-store';
import './functions/delete-store';
import './functions/get-me';

app.setup({
    enableHttpStream: true,
});