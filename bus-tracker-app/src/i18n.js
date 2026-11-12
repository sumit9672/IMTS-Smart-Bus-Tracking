import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      appTitle: "Live Bus Tracker",
      searchPlaceholder: "Search bus, source, destination...",
      todayBuses: "Today's Buses",
      from: "From",
      to: "To",
      status: "Status",
      viewLive: "View Live Location",
      onTime: "On Time",
      delayed: "Delayed"
    }
  },
  mr: {
    translation: {
      appTitle: "थेट बस ट्रॅकर",
      searchPlaceholder: "बस, ठिकाण शोधा...",
      todayBuses: "आजच्या बसेस",
      from: "इथून",
      to: "इथपर्यंत",
      status: "स्थिती",
      viewLive: "थेट लोकेशन पाहा",
      onTime: "वेळेवर",
      delayed: "उशिरा"
    }
  },
  hi: {
    translation: {
      appTitle: "लाइव बस ट्रैकर",
      searchPlaceholder: "बस, स्थान खोजें...",
      todayBuses: "आज की बसें",
      from: "यहाँ से",
      to: "यहाँ तक",
      status: "स्थिति",
      viewLive: "लाइव लोकेशन देखें",
      onTime: "समय पर",
      delayed: "देरी से"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "mr", // Default bhasha Marathi thevli ahe
  fallbackLng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;