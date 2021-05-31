import { KMS } from "aws-sdk";
import crypto from "crypto";

export const encrypt = async (message, credentials) => {
  const kms = new KMS({ region: "eu-central-1", credentials });
  const dataKey = await kms
    .generateDataKey({
      KeyId:
        "arn:aws:kms:eu-central-1:663242905762:key/8bcd9681-f305-4fb3-9bbd-07e65d2699b2",
      KeySpec: "AES_256",
    })
    .promise();
  const cipher = crypto.createCipher(
    "aes-256-cbc",
    dataKey.Plaintext.toString("base64")
  );
  return [
    cipher.update(message, "utf8", "base64") + cipher.final("base64"),
    dataKey.CiphertextBlob.toString("base64"),
  ];
};

export const decrypt = async (message, credentials) => {
  const kms = new KMS({ region: "eu-central-1", credentials });
  var kmsKeyBuffer = new Buffer(message.data_key, "base64");
  const kmsData = await kms.decrypt({ CiphertextBlob: kmsKeyBuffer }).promise();
  const decipher = crypto.createDecipher(
    "aes-256-cbc",
    kmsData.Plaintext.toString("base64")
  );
  return {
    ...message,
    body:
      decipher.update(message.body, "base64", "utf8") + decipher.final("utf8"),
  };
};
