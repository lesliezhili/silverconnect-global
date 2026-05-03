import * as React from "react";
import { Illustration, type IllustrationProps } from "./Placeholder";

type SceneProps = Omit<IllustrationProps, "id" | "label" | "variant">;

const make = (id: string, label: string) =>
  function Scene(props: SceneProps) {
    return (
      <Illustration
        id={id}
        label={label}
        variant="scene"
        size={160}
        {...props}
      />
    );
  };

export const S1TeaTime = make("S1", "Tea time");
export const S2CleaningTogether = make("S2", "Cleaning together");
export const S3EmptyBookings = make("S3", "Empty bookings");
export const S4EmptyChat = make("S4", "Empty chat");
export const S5PaymentSuccess = make("S5", "Payment success");
export const S6EmergencyCare = make("S6", "Emergency care");
export const S7NetworkError = make("S7", "Network error");
export const S8ProviderOnboarding = make("S8", "Provider onboarding");
export const S9RecurringBooking = make("S9", "Recurring booking");
export const S10FamilyInvite = make("S10", "Family invite");
