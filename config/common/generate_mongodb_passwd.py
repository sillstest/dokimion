import getpass
import bcrypt
import getpass

password = getpass.getpass();
hashedPasswd = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt());
print(hashedPasswd.decode())

