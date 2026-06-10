# Cbrixi Mobile (Phase 1)

React Native + Expo mobile app scaffold for the first release stage of Cbrixi.

## Scope Implemented

- Branded splash page using the Cbrixi SVG logo.
- 3-step onboarding flow (Skip, dots, Next/Get Started).
- Login screen connected to `https://api.cbrixi.com`.
- Signup screen connected to `https://api.cbrixi.com`.
- Favorites screen with persistent wishlist storage.
- Product details modal with installment setup and add-to-cart / buy-now actions.
- Cart screen with full-payment and EasyBuy selection.
- Payment screen using manual bank transfer only for now.
- User/Admin login fallback behavior matching the web app logic.
- Async session + onboarding persistence using AsyncStorage.

## Folder

This mobile app is intentionally outside the web app folder:

- `mobile/`

## Tech Stack

- Expo SDK 54
- React Native + TypeScript
- React Navigation (native stack)
- AsyncStorage
- `react-native-svg` for Cbrixi SVG rendering

## Screen Flow

1. `BrandSplash`
2. `Onboarding`
3. `Login`
4. `Signup`
5. `Home` (mobile marketplace home with backend products)
6. `Favorites` (wishlist page from saved items)
7. `Cart` (cart + payment method selection)
8. `ProductDetails` (modal)
9. `Payment` (manual bank transfer)

## Auth Field Parity with Web

The forms mirror the current web input fields in `smart/src/app/auth`.

Login fields:

- `email`
- `password`
- `rememberMe`

Signup fields:

- `firstname`
- `lastname`
- `username`
- `email`
- `password`
- `agreeToTerms`

## API Integration

Base URL:

- `https://api.cbrixi.com`

Endpoints used:

- `POST /user/login`
- `POST /admin/login`
- `GET /user/profile`
- `POST /user/signup`
- `GET /products`
- `POST /cart/add`
- `GET /cart`
- `PATCH /cart/item/:id`
- `DELETE /cart/item/:id`
- `POST /order/checkout`
- `POST /payment/paystack/initiate`
- `POST /payment/manual/initiate`

Environment override (optional):

- `EXPO_PUBLIC_API_URL`

Example:

```bash
EXPO_PUBLIC_API_URL=https://api.cbrixi.com
```

Startup note:

- The local `.env` file includes `EXPO_NO_DEPENDENCY_VALIDATION=1` so the regular `npx expo start` command works without `--offline`.
- Copy `mobile/.env.example` to `mobile/.env` if you are setting up the project on a new machine.

## Setup

From repo root:

```bash
cd mobile
npm install
npm run start
```

Then run on:

- Android: `npm run android`
- iOS: `npm run ios`
- Web preview: `npm run web`

## Structure

```text
mobile/
  assets/images/
  src/
    components/
    constants/
    hooks/
    navigation/
    screens/
    services/
    types/
    utils/
  App.tsx
  app.json
  package.json
```

## Notes for Phase 2

- Add forgot-password flow.
- Add social login only when backend OAuth routes are ready.
- Add stricter form validation and E2E tests.
