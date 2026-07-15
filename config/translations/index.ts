export type { Language, TranslationDictionary } from "./types";

import { Language, TranslationDictionary } from "./types";

import { nav as navVi } from "./vi/nav";
import { aboutPage as aboutPageVi } from "./vi/about";
import { lang as langVi } from "./vi/lang";
import { home as homeVi } from "./vi/home";
import { demo as demoVi } from "./vi/demo";
import { dashboard as dashboardVi } from "./vi/dashboard";
import { booking as bookingVi } from "./vi/booking";
import { auth as authVi } from "./vi/auth";
import { common as commonVi } from "./vi/common";
import { footer as footerVi } from "./vi/footer";
import { homePage as homePageVi } from "./vi/homePage";
import { airportTransfer as airportTransferVi } from "./vi/airportTransfer";
import { rentCar as rentCarVi } from "./vi/rentCar";
import { selfDrive as selfDriveVi } from "./vi/selfDrive";
import { tours as toursVi } from "./vi/tours";
import { pricing as pricingVi } from "./vi/pricing";

import { nav as navEn } from "./en/nav";
import { aboutPage as aboutPageEn } from "./en/about";
import { lang as langEn } from "./en/lang";
import { home as homeEn } from "./en/home";
import { demo as demoEn } from "./en/demo";
import { dashboard as dashboardEn } from "./en/dashboard";
import { booking as bookingEn } from "./en/booking";
import { auth as authEn } from "./en/auth";
import { common as commonEn } from "./en/common";
import { footer as footerEn } from "./en/footer";
import { homePage as homePageEn } from "./en/homePage";
import { airportTransfer as airportTransferEn } from "./en/airportTransfer";
import { rentCar as rentCarEn } from "./en/rentCar";
import { selfDrive as selfDriveEn } from "./en/selfDrive";
import { tours as toursEn } from "./en/tours";
import { pricing as pricingEn } from "./en/pricing";

import { nav as navKo } from "./ko/nav";
import { aboutPage as aboutPageKo } from "./ko/about";
import { lang as langKo } from "./ko/lang";
import { home as homeKo } from "./ko/home";
import { demo as demoKo } from "./ko/demo";
import { dashboard as dashboardKo } from "./ko/dashboard";
import { booking as bookingKo } from "./ko/booking";
import { auth as authKo } from "./ko/auth";
import { common as commonKo } from "./ko/common";
import { footer as footerKo } from "./ko/footer";
import { homePage as homePageKo } from "./ko/homePage";
import { airportTransfer as airportTransferKo } from "./ko/airportTransfer";
import { rentCar as rentCarKo } from "./ko/rentCar";
import { selfDrive as selfDriveKo } from "./ko/selfDrive";
import { tours as toursKo } from "./ko/tours";
import { pricing as pricingKo } from "./ko/pricing";

import { nav as navRu } from "./ru/nav";
import { aboutPage as aboutPageRu } from "./ru/about";
import { lang as langRu } from "./ru/lang";
import { home as homeRu } from "./ru/home";
import { demo as demoRu } from "./ru/demo";
import { dashboard as dashboardRu } from "./ru/dashboard";
import { booking as bookingRu } from "./ru/booking";
import { auth as authRu } from "./ru/auth";
import { common as commonRu } from "./ru/common";
import { footer as footerRu } from "./ru/footer";
import { homePage as homePageRu } from "./ru/homePage";
import { airportTransfer as airportTransferRu } from "./ru/airportTransfer";
import { rentCar as rentCarRu } from "./ru/rentCar";
import { selfDrive as selfDriveRu } from "./ru/selfDrive";
import { tours as toursRu } from "./ru/tours";
import { pricing as pricingRu } from "./ru/pricing";

const vi: TranslationDictionary = {
  nav: navVi,
  aboutPage: aboutPageVi,
  lang: langVi,
  home: homeVi,
  demo: demoVi,
  dashboard: dashboardVi,
  booking: bookingVi,
  auth: authVi,
  common: commonVi,
  footer: footerVi,
  homePage: homePageVi,
  airportTransfer: airportTransferVi,
  rentCar: rentCarVi,
  selfDrive: selfDriveVi,
  tours: toursVi,
  pricing: pricingVi,
};

const en: TranslationDictionary = {
  nav: navEn,
  aboutPage: aboutPageEn,
  lang: langEn,
  home: homeEn,
  demo: demoEn,
  dashboard: dashboardEn,
  booking: bookingEn,
  auth: authEn,
  common: commonEn,
  footer: footerEn,
  homePage: homePageEn,
  airportTransfer: airportTransferEn,
  rentCar: rentCarEn,
  selfDrive: selfDriveEn,
  tours: toursEn,
  pricing: pricingEn,
};

const ko: TranslationDictionary = {
  nav: navKo,
  aboutPage: aboutPageKo,
  lang: langKo,
  home: homeKo,
  demo: demoKo,
  dashboard: dashboardKo,
  booking: bookingKo,
  auth: authKo,
  common: commonKo,
  footer: footerKo,
  homePage: homePageKo,
  airportTransfer: airportTransferKo,
  rentCar: rentCarKo,
  selfDrive: selfDriveKo,
  tours: toursKo,
  pricing: pricingKo,
};

const ru: TranslationDictionary = {
  nav: navRu,
  aboutPage: aboutPageRu,
  lang: langRu,
  home: homeRu,
  demo: demoRu,
  dashboard: dashboardRu,
  booking: bookingRu,
  auth: authRu,
  common: commonRu,
  footer: footerRu,
  homePage: homePageRu,
  airportTransfer: airportTransferRu,
  rentCar: rentCarRu,
  selfDrive: selfDriveRu,
  tours: toursRu,
  pricing: pricingRu,
};

export const translations: Record<Language, TranslationDictionary> = { vi, en, ko, ru };
