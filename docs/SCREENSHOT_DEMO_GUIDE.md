# EnterpriseFlow CRM - V1 Screenshot Demo Guide

Use the following screenshot order for project documentation, portfolio presentation, viva, and interview demos.

## Screenshot sequence

1. **Secure Login**  
   Caption: `Secure JWT-based authentication for EnterpriseFlow CRM.`

2. **Super Admin - Company Management**  
   Caption: `Platform-level multi-company management with tenant isolation.`

3. **Super Admin - User & Role Management**  
   Caption: `Role-based user management across Super Admin, Admin, Engineer, and Customer accounts.`

4. **Super Admin - Global Ticket Workspace**  
   Caption: `Authorized platform-wide ticket visibility with search, filters, priorities, and tenant-aware access.`

5. **Customer Isolation**  
   Caption: `Customer-level isolation: users can access only their own support requests.`

6. **Engineer Operations Dashboard**  
   Caption: `Engineers work only on assigned same-company tickets and receive workflow notifications.`

7. **Ticket Details, Status & Audit Trail**  
   Caption: `Status updates, comments, and complete ticket audit history are recorded for traceability.`

8. **Support Ticket Creation**  
   Caption: `Role-aware support request creation with server-derived reporter/company scope.`

## Verified notification evidence

During final V1 validation:

- Engineer status updates generated persistent customer notifications.
- Engineer comments generated persistent customer notifications.
- Notification documents were verified in MongoDB Atlas.
- Transactional email delivery through the Resend HTTPS API was verified end-to-end.

## Recommended demo order

`Login -> Companies -> Users -> Global Tickets -> Customer Isolation -> Engineer Dashboard -> Ticket Activity -> Create Ticket -> Notifications/Email`

## Closing statement

> The main engineering challenge was secure tenant-aware and role-aware authorization, not just CRUD operations.
