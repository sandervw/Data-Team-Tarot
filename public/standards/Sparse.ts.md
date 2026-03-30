# The Laws of Sparse Typescript

## The Primary Laws

1. All Sparse Typescript Laws must adhere to the Laws defined in `Sparse.md`. `No Exceptions.`
2. All Typescript specific Sparse Laws must be specified within this file. `No Exceptions.`

## Typescript Specific Laws

3. Use `strict` mode in `tsconfig.json`. `No Exceptions.`
4. Use `unknown` instead of `any` for variables with uncertain types. `No Exceptions.`
5. All function inputs must be `readonly`. `No Exceptions.`
6. All functions must have explicit return types. `No Exceptions.`
7. All exported classes, functions, and interfaces must use explicit types for parameters and return values. `No Exceptions.`
8. All functions must use arrow function syntax, not function declarations. `No Exceptions.`
9. Only use implicit types for local variables. `No Exceptions.`
10. All object shapes must be defined using interfaces. `No Exceptions.`
11. All primitives, unions, and mapped/conditional types must be defined using type aliases. `No Exceptions.`
12. All variant objects must use discriminated unions, not class hierarchies. `No Exceptions.`
13. Use unions of literal types instead of enums. `No Exceptions.`
14. Use Promises for your own async control flow: only use callbacks for framework-mandated signatures. `No Exceptions.`
15. All export statements must be at the bottom of the file. `No Exceptions.`
16. All exports must use named exports, no default exports. `No Exceptions.`

`No Exceptions.`
