const AWS = require("aws-sdk");
const ses = new AWS.SES({ region: "us-east-1" });
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require("uuid");

const recipients = ["brendanjeffreymcmahon@gmail.com"];

exports.handler = async (event) => {
  const promises = recipients.map(async (recipient) => {
    const guid = uuidv4();

    await saveNewRecord(guid);

    await sendEmail(recipient, guid);
  });

  try {
    await Promise.all(promises);
    console.log("All emails sent and records saved successfully");
    return {
      statusCode: 200,
      body: JSON.stringify("All emails sent and records saved successfully"),
    };
  } catch (error) {
    console.error("Error processing requests", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Error processing requests"),
    };
  }
};

const saveNewRecord = async (guid) => {
  const record = {
    TableName: "morale",
    Item: {
      id: guid,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      value: 0,
    },
  };

  try {
    await dynamodb.put(record).promise();
    console.log("Record saved successfully");
  } catch (error) {
    console.error("Error saving record", error);
  }
};

const sendEmail = async (recipient, guid) => {
  const url = `https://ttk1ou06i5.execute-api.us-east-1.amazonaws.com/production?guid=${guid}&value=0`;
  const params = {
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: `Hello, this is a test email sent using AWS Lambda and Amazon SES.\n ${url}`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Test email from Lambda and SES",
      },
    },
    Source: "brendanjeffreymcmahon@gmail.com",
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log("Email sent successfully", result);
    return {
      statusCode: 200,
      body: JSON.stringify("Email sent successfully"),
    };
  } catch (error) {
    console.error("Error sending email", error);
    return {
      statusCode: 500,
      body: JSON.stringify("Error sending email"),
    };
  }
};
