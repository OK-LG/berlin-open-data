import { lookupProperty } from "../src/tools/lookup-property.js";

async function test() {
  const result = await lookupProperty({
    street: "Jahnstraße",
    house_number: "34",
    postal_code: "12347"
  });
  console.log(JSON.stringify(result, null, 2));
}

test();
