import * as React from "react";
import { Illustration, type IllustrationProps } from "./Placeholder";

type CharacterProps = Omit<IllustrationProps, "id" | "label" | "variant">;

const make = (id: string, label: string) =>
  function Character(props: CharacterProps) {
    return <Illustration id={id} label={label} variant="character" {...props} />;
  };

export const C1GrandmaWang = make("C1", "Grandma Wang");
export const C2GrandpaLi = make("C2", "Grandpa Li");
export const C3HelperMei = make("C3", "Helper Mei");
export const C4CookZhang = make("C4", "Cook Zhang");
export const C5GardenerTom = make("C5", "Gardener Tom");
export const C6NurseAnna = make("C6", "Nurse Anna");
export const C7FixerBob = make("C7", "Fixer Bob");
export const C8FamilyDaughter = make("C8", "Daughter Min");
export const C9AICompanion = make("C9", "AI Companion");
export const C10Admin = make("C10", "Admin");
