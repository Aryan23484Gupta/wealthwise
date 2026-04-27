function write(level, message, meta) {
  const timestamp = new Date().toISOString();

  if (meta) {
    console.log(`[${timestamp}] [${level}] ${message}`, meta);
    return;
  }

  console.log(`[${timestamp}] [${level}] ${message}`);
}

module.exports = {
  info(message, meta) {
    write("INFO", message, meta);
  },
  warn(message, meta) {
    write("WARN", message, meta);
  },
  error(message, meta) {
    write("ERROR", message, meta);
  },
  http(message, meta) {
    write("HTTP", message, meta);
  }
};
