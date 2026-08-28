import { RouterProvider } from "react-router";
import { router } from "@/app/routes";
import { I18nProvider } from "@/app/i18n/I18nProvider";
import { AppStoreProvider } from "@/app/store/AppStore";

export default function App() {
  return (
    <I18nProvider>
      <AppStoreProvider>
        <RouterProvider router={router} />
      </AppStoreProvider>
    </I18nProvider>
  );
}
