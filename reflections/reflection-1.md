# Progress Documentation

## Project Overview

### Project Description:
This platform is designed to allow students from the University of Cape Town to sell products online, allowing for a secure and easy transaction experience between students. It offers a marketplace where students can list items, browse products, and make secure payments directly within the platform.

### Goals:
- **User Registration**: Enable UCT students to create accounts using their school email, list products, and manage their stores.
- **Secure Payments**: Provide a secure payment gateway for smooth transactions between students, or offer an option to pay on collection.
- **User-Friendly Interface**: Design an intuitive, responsive interface for browsing and purchasing items.
- **Security & Privacy**: Ensure all transactions are secure, with appropriate measures for privacy and data protection.
- **Scalability**: Build a scalable solution to handle an increasing number of product listings and user base as the platform grows.

---

## Progress Log

### [Date: 2025-07-05] - 50 days since the start of development.

#### Achievements:
- **User Authentication (Auth)**: 
  - Implemented user registration with email verification. The registration system uses UCT student emails to ensure proper access control.
  
- **Profile Updates**: 
  - Implemented user profile update functionality (still to integrate with the frontend).
  
- **Store Creation**: 
  - Registered and verified users are now able to create and manage their own stores.
  
- **Product Listings**: 
  - Vendors can list their products, complete with descriptions, images, and prices.

- **Product Fetching and Filtering**: 
  - Users can view products listed by vendors and apply filters (e.g., category, price, etc.) to search for specific items.

#### Issues Encountered:
- **Frontend-Backend Sync**: 
  - Struggled with keeping the client side and backend in sync. Data fetching was often inconsistent.
   - **Solution**: Integrated **React Query** to help with automatic data fetching, caching, and updating the UI without the need for expensive API calls.

- **Logout Functionality**: 
  - Users could log out on the client side but still make API requests using the old token (via Postman/terminal).
   - **Solution**: Created a **logout endpoint** to handle token invalidation. Tokens are now added to a **blacklist table** in the database and automatically deleted 24 hours after logout.

- **Database Scaling**: 
  - **Issue**: Faced challenges with scaling the database to accommodate a large number of product listings.
   - **Solution**: Added **indexing** to optimise product retrieval speed.
   - **Trade-Off**: Encountered a **time-time trade-off**. While indexing improved product retrieval speed, it slightly slowed down product creation. This was a calculated decision, as **browsing products** will likely be more frequent than **listing products** for the users, making the trade-off worth it.


#### Next Steps:
- **Product Details Page**: 
  - Continue development of the **Product Details Page** with an “**Add to Cart**” feature. The cart functionality will allow users to save products and proceed to checkout.
  
---

#### What Went Well:
- **User Auth**: 
  - The user authentication process (registration and email verification) is fully functional. It's secure and seamlessly integrated with UCT's student email system, ensuring only valid students can register.
  
- **API creation**: 
  - Most user and vendor api's are already created and just need to be intergrated with the frontend.

#### Areas for Improvement:
- **Frontend & Backend Sync**: 
  - Although React Query has improved data fetching, there are still some minor issues with inconsistent data updates between the frontend and backend. I need to explore more efficient state management solutions.


#### Lessons Learned:
- **Session Management**: 
  - Learned the importance of implementing proper session management. Simply removing tokens from local storage didn’t provide enough security, which is why implementing the token blacklist was critical.

---

## Upcoming Milestones

- **Milestone #1**: 
  - **Product Details & Cart**: Finish developing the product details page and integrate the "Add to Cart" functionality for better shopping experience.
  - **Expected Completion Date**: 2025-07-15

- **Milestone #2**: 
  - **Vendor Dashboard Completion**: Finalise and implement the vendor dashboard with better usability and analytics for store performance.
  - **Expected Completion Date**: 2025-07-30
  
- **Milestone #3**: 
  - **Complete Admin Dashboard**: Create and complete the admin dashboard.
  - **Expected Completion Date**: 2025-08-10
  
- **Milestone #4**: 
  - **Payment Gateway Integration**: Begin integrating a secure payment gateway that allows students to pay online or opt for cash on collection.
  - **Expected Completion Date**: 2025-08-15
  

---


## Additional Notes

- **Mobile Responsiveness**: I need to ensure that the platform is fully responsive for mobile users. Most students will likely use the platform on their phones.
  
- **User Feedback**: After launching the beta version, I plan to gather more student feedback, focusing on UI/UX and payment options to make further adjustments.
  

---

