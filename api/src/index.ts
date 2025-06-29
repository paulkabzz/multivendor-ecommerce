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
import './functions/my-store';
import './functions/logout';
import './functions/get-subcategories';
import './functions/get-other';

app.setup({
    enableHttpStream: true,
});