import test from "node:test";
import assert from "node:assert/strict";
import {iconOf, knownIcon, iconNames, GLYPHS} from "../skills/planview/lib/icons.mjs";

test("an explicit icon wins, with its provider", () => {
  assert.deepEqual(iconOf({name: "Uploads", icon: "aws:s3"}), {glyph: "bucket", family: "aws"});
  assert.deepEqual(iconOf({name: "x", icon: "database"}), {glyph: "database"});
  assert.equal(iconOf({name: "PostgreSQL", icon: "none"}), null);
});

test("icons are guessed from the name and id", () => {
  assert.deepEqual(iconOf({name: "S3 bucket"}), {glyph: "bucket", family: "aws"});
  assert.deepEqual(iconOf({name: "BigQuery"}), {glyph: "warehouse", family: "gcp"});
  assert.deepEqual(iconOf({name: "CronJob import"}), {glyph: "clock", family: "k8s"});
  assert.equal(iconOf({name: "PostgreSQL"}).glyph, "database");
  assert.equal(iconOf({name: "Customer API"}).glyph, "api");
  assert.equal(iconOf({name: "Warehouse key"}).glyph, "key");
  assert.equal(iconOf({name: "Something"}, "userRepo").glyph, "git");
  assert.equal(iconOf({name: "Zebra"}), null);
});

test("a picture can give its provider to generic boxes", () => {
  assert.deepEqual(iconOf({name: "Secret"}, "secret", "k8s"), {glyph: "secret", family: "k8s"});
  assert.deepEqual(iconOf({name: "S3"}, "s3", "k8s"), {glyph: "bucket", family: "aws"});
});

test("every named icon resolves to a glyph", () => {
  for (const name of iconNames()) assert.ok(knownIcon(name), name);
  for (const g of Object.values(GLYPHS)) assert.doesNotMatch(g, /<script|on\w+=/i);
  assert.equal(knownIcon("aws:whatever"), true);
  assert.equal(knownIcon("nope"), false);
  assert.equal(knownIcon("acme:thing"), false);
});
