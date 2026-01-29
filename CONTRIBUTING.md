# Contributing to ChunkFlow Upload SDK

Thank you for your interest in contributing to ChunkFlow Upload SDK!

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build all packages:
   ```bash
   pnpm build
   ```

## Development Workflow

### Making Changes

1. Create a new branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and ensure tests pass:

   ```bash
   pnpm test
   ```

3. Lint and format your code:

   ```bash
   pnpm lint
   pnpm format
   ```

4. Commit your changes following conventional commits:
   ```bash
   git commit -m "feat: add new feature"
   ```

### Testing

- Write unit tests for specific examples and edge cases
- Write property-based tests for universal properties
- Ensure all tests pass before submitting PR

### Code Style

- Use TypeScript for all code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `chore:` - Build process or auxiliary tool changes
- `refactor:` - Code refactoring

### Pull Requests

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG if applicable
5. Submit PR with clear description

## Project Structure

- `packages/` - SDK packages
- `apps/` - Applications (server, playground, website)
- `.changeset/` - Changeset configuration for versioning

## Questions?

Feel free to open an issue for any questions or concerns.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
