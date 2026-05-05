import CookieConsent from "react-cookie-consent";

const CookieConsentDialog = () => {

  return (
    <CookieConsent
        onAccept={() => console.log("accepted cookies")}
        enableDeclineButton
        onDecline={() => console.log("declined cookies")}
      >
        เว็บไซต์นี้ใช้คุกกี้เพื่อประสบการณ์การใช้งานที่ดีขึ้น
      </CookieConsent>
  );
};

export default CookieConsentDialog;
