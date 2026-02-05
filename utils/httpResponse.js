export function handleSuccess(content, res){
  res.status(200).json({content, success: true})
}

export function handleError(message, res, status = 500) {
  console.error(message);
  res.status(status).json({ message: message, success: false });
}