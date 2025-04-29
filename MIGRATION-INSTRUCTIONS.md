# Database Migration Instructions

To add the `yearsOfExperience` field to the database, follow these steps:

1. Make sure the field is added to the Prisma schema in `prisma/schema.prisma`:

```prisma
model User {
  // ...
  yearsOfExperience  Int?          // Years of experience for artists
  // ...
}
```

2. Create and apply the migration:

```bash
npx prisma migrate dev --name add_years_of_experience
```

3. Generate the updated Prisma client:

```bash
npx prisma generate
```

4. Restart your development server:

```bash
npm run dev
```

## Note

Until the database migration is completed, you might see TypeScript errors related to the `yearsOfExperience` field in various components.
