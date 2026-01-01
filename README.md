
# AttendEase v3 - Technical Specification

## Core Logic & Global Business Rules
- **Credit System**: 1 credit deduction for booking/marking. 1 credit refund for cancellation (within rules).
- **30-Minute Rule**: Cancellations locked <30m from start. Sessions hidden from Trainee booking >30m after start.
- **Strict Credit Check**: 0 balance prohibits booking/manual marking. Inline error: "Insufficient credits. Trainee must top up."
- **Data Integrity**: Duplicate sessions (Name, Date, Time) are blocked using whitespace-insensitive, case-insensitive checks.
- **Email Security**: Changing an email triggers an inline warning. Warning disappears if reverted.

## User Roles
- **Admin**: 
  - Full CRUD for Users, Classes, and Packages.
  - **Manual Attendance**: Admin can take attendance for any class via a roster view.
  - **Revenue**: Calculated in **SGD** based on credit package sales.
  - **Dashboard Stats**: Shows "Sessions Today" (filtered for current date) and "Check-in" (total attendance).
  - New users get a randomly generated 8-char secure password.
- **Trainer**: 
  - Can view all classes.
  - **Ownership**: Can Add/Edit/Delete classes they created. Classes show creator tags (Admin/Trainer).
  - Can manage rosters for any class assigned to them or created by them.
- **Trainee**: 
  - Book/Cancel upcoming sessions (filters for current/future time).
  - Wallet with package shop. Credit purchases require inline confirmation and show success feedback.
  - Full history log with "SELF" or "STAFF" method labelling.

## Technical Implementation
- **Mobile-First**: Max-width 448px, white background with blue/purple gradients.
- **Media**: Profile photo support with global header synchronization.
- **Activity Feed**: Labels updated for clarity ("SELF" instead of "AUTO").
- **Authentication**: Demo accounts clickable on login for instant access.
