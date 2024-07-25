package com.testquack.dal;

import com.mongodb.ConnectionString;
import com.mongodb.MongoCredential;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerAddress;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.concurrent.TimeUnit;

import static com.mongodb.internal.connection.ServerAddressHelper.createServerAddress;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Value("${mongo.replicaSet}")
    String replicaSet;

    @Value("${mongo.dbname}")
    String dbname;

    @Value("${mongo.username}")
    String username;

    @Value("${mongo.password}")
    String password;

    @Value("${mongo.uri}")
    String uri;

    @Override
    public MongoClient mongoClient() {
        if(!isEmpty(uri)){
            return getClientByUri();
        }

        List<ServerAddress> addresses = Stream.of(replicaSet.split(",")).
                map(String::trim).
                map(host-> {
                    String[] tokens = host.split(":");
                    return tokens.length == 2 ?
                            createServerAddress(tokens[0], Integer.parseInt(tokens[1])) :
                            createServerAddress(host);

                }).
                collect(Collectors.toList());

        MongoClientSettings.Builder settingsBuilder = MongoClientSettings.builder()
                .applyToClusterSettings(builder ->
                        builder.hosts(addresses)
                );

System.out.println("MongoConfig::mongoClient - username: " + username );
System.out.println("MongoConfig::mongoClient - dbname: " + dbname );
System.out.println("MongoConfig::mongoClient - password: " + password );
System.out.flush();


        if (!isEmpty(username)){
           final String secretKey = "al;jf;lda1_+_!!()!!!!";
           String decryptedPasswd = aes.decrypt(password, secretKey) ;

           settingsBuilder.credential(MongoCredential.createCredential(username, "admin", 
               decryptedPasswd.toCharArray()));
        }

        settingsBuilder.applyToConnectionPoolSettings(builder ->
                       builder.minSize(10)
                       .maxSize(100)
                       .maxWaitTime(5, TimeUnit.SECONDS));

        return MongoClients.create(settingsBuilder.build());
    }

    private MongoClient getClientByUri(){
        ConnectionString connectionString = new ConnectionString(uri);
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .build();
        return MongoClients.create(settings);
    }

    @Override
    protected String getDatabaseName() {
        return dbname;
    }
}
