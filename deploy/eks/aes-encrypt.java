// Prints the AES ciphertext of a plaintext admin password, using the SAME algorithm and
// hard-coded key as the Dokimion app (api .../DbAuthProvider.java, dal/.../aes.java):
// SHA-1(key) -> first 16 bytes -> AES/ECB/PKCS5Padding -> Base64.
//
//   java deploy/eks/aes-encrypt.java 'YourAdminPassword'
//
// Put the output in deploy/eks/20-dokimion-config.yaml  (Secret: AUTH_ADMIN_PASSWORD).
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

public class AesEncrypt {
    // identical to the key hard-coded in DbAuthProvider.java / MongoConfig.java
    static final String SECRET = "al;jf;lda1_+_!!()!!!!";

    public static void main(String[] args) throws Exception {
        if (args.length != 1) {
            System.err.println("usage: java aes-encrypt.java '<plaintext admin password>'");
            System.exit(2);
        }
        byte[] key = MessageDigest.getInstance("SHA-1").digest(SECRET.getBytes("UTF-8"));
        key = Arrays.copyOf(key, 16);
        Cipher c = Cipher.getInstance("AES/ECB/PKCS5Padding");
        c.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"));
        System.out.println(Base64.getEncoder().encodeToString(c.doFinal(args[0].getBytes("UTF-8"))));
    }
}
