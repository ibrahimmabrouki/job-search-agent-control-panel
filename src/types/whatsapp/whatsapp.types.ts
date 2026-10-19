// This file is build in order to define the types for Whatsapp API responses and requests
// These types are going to be used when we want to make a cleaner and more structured code for the Whatsapp API integration

// -----------------------------------------------------------------------------
// Whatsapp API types
// -----------------------------------------------------------------------------

// For the Whatsapp Status API Instead of exposing the entire response of api/status
// Our backend endpoint GET /api/v1/whatsapp/status will only return the Whatsapp information
export type WhatsAppStatus = {
  connected: boolean;
  state: string;
  needsAttention: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  updatedAt: string;
};
// connected — easy boolean for the UI. true when WhatsApp is connected.
// state — Hermes' actual state, currently "disconnected".
// needsAttention — tells the UI whether the user should take action.
// errorCode — machine-readable Hermes error if one exists.
// errorMessage — human-readable error if something went wrong.
// updatedAt — when Hermes last updated this platform state.