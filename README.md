# Pixel Gunner → App Store

Нужно: Mac с **Xcode 26+** (Apple требует его для загрузки с 28.04.2026), аккаунт **Apple Developer Program** (99 $/год), Node.js.

1. Проверка в VS Code: открой `www/` → Live Server на `index.html`.
2. В `capacitor.config.json` поменяй `appId` на свой (например `com.ivan.pixelgunner`) — потом его не изменить.
3. В терминале в этой папке:

       npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/haptics
       npm install -D @capacitor/assets
       npx cap add ios
       npx capacitor-assets generate --ios
       npx cap sync ios
       npx cap open ios

4. Xcode: Signing & Capabilities → твоя Team; General → Orientation только Portrait; проверь на iPhone (▶).
5. Product → Archive → Distribute App → App Store Connect.
6. В App Store Connect: создай приложение, вставь тексты из `APP_STORE_LISTING.md`, скриншоты, ссылку на политику конфиденциальности (`privacy-policy.html`), пройди анкету возрастного рейтинга → Submit for Review.

Если изменишь игру в `www/`, перед сборкой выполни `npx cap sync ios`.
