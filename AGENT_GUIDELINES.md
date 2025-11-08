# TypeScript Development Guidelines

## Core Principles

- Use the simplest possible solution
- Prefer procedural programming and functional programming paradigms
- Use well-maintained, mature libraries where possible (check npm weekly downloads and last update date)
- If you feel a need to use object-oriented programming or polymorphism, ask the user about your design first
- Ensure you include JSDoc comments for all exported functions, classes, and interfaces
- Run the formatter (Prettier) and linter (ESLint) as frequently as possible to detect any issues and fix them
- Use `pnpm run format` to format code and `pnpm run lint:fix` to auto-fix linting issues
- Avoid overriding the linter or using language escape hatches such as:
  - `any` type assertions
  - `@ts-ignore` or `@ts-expect-error` comments
  - Type assertions without proper validation
- After you have finished your implementation:
  - **ALWAYS run the formatter**: `pnpm run format` to format all code with Prettier
  - **ALWAYS run the linter**: `pnpm run lint:fix` to detect and auto-fix ESLint issues
  - **ALWAYS run the type checker**: `pnpm run type-check` to check for TypeScript errors
  - **RECOMMENDED**: Run all checks at once with `pnpm run validate`
  - Test your implementation using the project's test framework (Jest, Vitest, etc.)
  - If you don't know how to test your implementation, ask the user for help
  - **NEVER commit code** that has linting errors, formatting issues, or type errors
- When handling unknown data structures, use a validation library such as Zod, io-ts, or yup

## TypeScript-Specific Guidelines

### Type Safety

- **Always enable strict mode** in `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true
    }
  }
  ```
- Prefer `unknown` over `any` when the type is truly unknown
- Use type guards and narrowing for runtime type checking
- Define explicit return types for functions to catch errors early
- Use `const` assertions for literal types when appropriate

### Types and Interfaces

- Prefer `interface` for object shapes that might be extended
- Use `type` for unions, intersections, and utility types
- Keep types close to where they are used
- Export types that are part of the public API
- Use descriptive names for type parameters: `<TUser>` instead of `<T>`

### Functions and Methods

- Use arrow functions for callbacks and inline functions
- Use regular function declarations for top-level functions
- Provide JSDoc comments with examples:
  ```typescript
  /**
   * Calculates the total price including tax
   * @param price - Base price in cents
   * @param taxRate - Tax rate as a decimal (e.g., 0.08 for 8%)
   * @returns Total price in cents
   * @example
   * calculateTotal(1000, 0.08) // returns 1080
   */
  ```

### Error Handling

- Use proper error types and avoid throwing strings
- Create custom error classes for domain-specific errors
- Use Result/Either patterns for expected errors when appropriate
- Always handle Promise rejections

### Code Organization

- One exported item per file for components/classes
- Group related utilities in a single file
- Use barrel exports (index.ts) sparingly to avoid circular dependencies
- Follow consistent file naming: `kebab-case.ts` or `PascalCase.tsx` for React

### Dependencies and Imports

- Use named imports instead of default imports where possible
- Order imports: external libs, internal modules, types, styles
- Avoid circular dependencies
- Use path aliases for cleaner imports when configured

### Testing

- Write tests alongside implementation
- Use descriptive test names that explain the behavior
- Test types using utility types like `Expect` or `AssertTrue`
- Mock external dependencies properly
- Aim for meaningful coverage, not just high percentages

### Performance

- Use `const enum` for compile-time constants
- Avoid premature optimization
- Use lazy imports for large libraries
- Consider bundle size when adding dependencies

### React-Specific (if applicable)

- Use functional components with hooks
- Define prop types using interfaces
- Use `React.FC` sparingly (prefer explicit return types)
- Memoize expensive computations with `useMemo`
- Use `useCallback` for stable function references

### Common Patterns

- **Builder Pattern**: Use method chaining with proper type inference
- **Factory Functions**: Prefer over classes for creating objects
- **Discriminated Unions**: Use for state machines and variant types
- **Type Predicates**: Create reusable type guards
- **Utility Types**: Leverage built-in types like `Partial`, `Required`, `Pick`, `Omit`

### Validation

- Runtime validation at system boundaries:

  ```typescript
  import { z } from "zod";

  const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    age: z.number().min(0).max(120),
  });

  type User = z.infer<typeof UserSchema>;
  ```

### Debugging

- Use the TypeScript Language Server for IDE support
- Enable source maps for debugging
- Use `debugger` statements sparingly and remove before committing
- Leverage Chrome DevTools for runtime debugging

## Mandatory Validation Steps

Before committing any code changes, you **MUST** run the following validation steps:

1. **Format code**: Run `pnpm run format` to ensure consistent formatting
2. **Fix linting issues**: Run `pnpm run lint:fix` to auto-fix linting errors
3. **Check types**: Run `pnpm run type-check` to verify TypeScript compilation
4. **Run all checks**: Use `pnpm run validate` to run all checks at once

## Checklist Before Committing

- [ ] Code formatted with Prettier (`pnpm run format`)
- [ ] All ESLint warnings and errors resolved (`pnpm run lint:fix`)
- [ ] All TypeScript compilation errors resolved (`pnpm run type-check`)
- [ ] Tests passing
- [ ] No `any` types without justification
- [ ] No `@ts-ignore` comments
- [ ] JSDoc comments for all exported functions, classes, interfaces, and types
- [ ] Explicit return types on all functions
- [ ] Types exported where needed
- [ ] No circular dependencies
- [ ] Bundle size impact considered for new dependencies
