exports.verify = (req,res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const verifyToken = (process.env.META_VERIFY_TOKEN || process.env.VERIFY_TOKEN || '').trim();

  if(mode === 'subscribe' && token === verifyToken){
    console.log("VERIFY SUCCESS");
    return res.status(200).send(challenge);
  }
  console.log("VERIFY FAILED - token mismatch");
  return res.sendStatus(403);
};

exports.receive = async (req,res) => {
  // 1. Meta ko turant 200 bhej de
  res.sendStatus(200);

  try{
    console.log("BODY:", JSON.stringify(req.body).slice(0,1000));
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const phoneId = entry?.metadata?.phone_number_id;
    const message = entry?.messages?.[0];

    // status update (delivered/read) ho to ignore
    if(!message ||!phoneId) return;

    const client = await findByPhoneId(phoneId);
    const sheetId = client?.google_sheet_id || process.env.TEST_SHEET_ID;

    if(!sheetId){
      console.log("Sheet ID nahi mila, phoneId:", phoneId);
      return;
    }

    if(!client) {
      console.log("Client nahi mila, TEST_SHEET_ID use kar raha hu:", sheetId);
    }

    const customerPhone = message.from;
    const text = message.text?.body || `[${message.type}]`;
    const { qty, item } = parseOrder(text);

    const row = [new Date().toISOString(), customerPhone, text, item || '', qty || ''];

    console.log("SHEET ME DAAL RAHA:", row);
    await appendToSheet(sheetId, row);
    console.log("Sheet success");

  }catch(e){
    console.error("ERROR in receive:", e.message, e.stack);
  }
};