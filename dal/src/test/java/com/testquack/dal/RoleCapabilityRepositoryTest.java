package com.testquack.dal;

import org.junit.Before;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import com.testquack.beans.Filter;
import com.testquack.beans.Order;
import com.testquack.beans.RoleCapability;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;

import java.util.List;

import static java.util.stream.Collectors.toList;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThat;

public class RoleCapabilityRepositoryTest extends DalBaseTest {

    @Autowired
    private RoleCapabilityRepository roleCapRepo;

    @Autowired
    private MongoOperations mongoOperations;

    @Before
    public void setUp(){
        mongoOperations.dropCollection("RoleCapability");
    }

    @Test
    public void rolecapSaveTest(){
        RoleCapability roleCap = roleCapRepo.save(new RoleCapability().withRole(Role.TESTER));
        assertNotNull(roleCap.getId());

        RoleCapability roleCapFetched = roleCapRepo.findById(roleCap.getId()).get();
        assertNotNull(roleCapFetched);
        assertThat(roleCapFetched.getRole(), is(roleCap.getRole()));
    }

    @Test
    public void findFilteredSingleFieldTest(){
       roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.TESTER));
       roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.TESTDEVELOPER));
       roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.ADMIN));

       List<RoleCapability> roleCaps = roleCapRepo.find(
                null,
                null,
                new Filter().withField("role", Role.TESTDEVELOPER)
       );
       assertThat(roleCaps.size(), is(1));
       assertThat(roleCaps.get(0).getRole(), is(Role.TESTDEVELOPER));

       for (RoleCapability roleCap : roleCaps ) {
          System.out.println("findFilteredSingleFieldTest - role: " + roleCap.getRole().value());
          System.out.flush();
       }
    }

    @Test
    public void findFilteredMultipleValuesFieldTest(){

        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withCapability(Capability.READ));
        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withCapability(Capability.READWRITE));
        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withCapability(Capability.ADMIN));


        List<RoleCapability> roleCaps = roleCapRepo.find(
             null,
             null,
             new Filter().
                     withField("capability", Capability.READWRITE).
                     withField("capability", Capability.ADMIN)
        );
        assertThat(roleCaps.size(), is(2));
        assertThat(roleCaps.stream().map(RoleCapability::getCapability).collect(toList()),
                containsInAnyOrder(Capability.READWRITE, Capability.ADMIN));

       for (RoleCapability roleCap : roleCaps ) {
          System.out.println("findFilteredMultipleValuesFieldTest capability: " + roleCap.getCapability().value());
          System.out.flush();
       }


    }

    @Test
    public void findFilteredMultipleFieldTest(){

        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.TESTER).withCapability(Capability.READWRITE));
        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.TESTDEVELOPER).withCapability(Capability.WRITE));
        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.ADMIN).withCapability(Capability.READWRITE));

/*
        List<Project> projects = projectRepository.find(
                null,
                null,
                new Filter().
                        withField("name", "Pr2").
                        withField("name", "Pr3").
                        withField("createdBy", "AAA")
        );
*/

        List<RoleCapability> roleCaps = roleCapRepo.find(
             null,
             null,
             new Filter().
                      withField("role", Role.TESTER).
                      withField("role", Role.TESTDEVELOPER).
                      withField("capability", Capability.READWRITE)
        );

        assertThat(roleCaps.size(), is(1));
        assertThat(roleCaps.get(0).getRole(), is(Role.TESTER));
    }

    @Test
    public void findOrderedTest(){

        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.TESTER));
        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.TESTDEVELOPER));
        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.ADMIN));

        List<RoleCapability> roleCaps = roleCapRepo.find(
                null,
                null,
                new Filter().
                        withSortField("role")
        );

        assertThat(roleCaps.size(), is(3));
        assertThat(roleCaps.stream().map(RoleCapability::getRole).collect(toList()),
                contains(Role.ADMIN, Role.TESTDEVELOPER, Role.TESTER));

        roleCaps = roleCapRepo.find(
                null,
                null,
                new Filter().
                        withSortField("role").withOrder(Order.DESC)
        );
       
        assertThat(roleCaps.size(), is(3));
        assertThat(roleCaps.stream().map(RoleCapability::getRole).collect(toList()),
                contains(Role.TESTER, Role.TESTDEVELOPER, Role.ADMIN));

    }

    @Test
    public void findLimitedFieldsTest(){
        roleCapRepo.save(null, "RoleCapability", new RoleCapability().withRole(Role.TESTER).withCapability(Capability.WRITE));

        List<RoleCapability> roleCaps = roleCapRepo.find(
             null,
             null,
             new Filter().
                     withExcludedField("capability")
        );

        assertThat(roleCaps.size(), is(1));
        assertThat(roleCaps.get(0).getRole(), is(Role.TESTER));
        assertNull(roleCaps.get(0).getCapability());

        roleCaps = roleCapRepo.find(
             null,
             null,
             new Filter().
                     withIncludedField("capability")
        );

        assertThat(roleCaps.size(), is(1));
        assertThat(roleCaps.get(0).getCapability(), is(Capability.WRITE));
        assertNull(roleCaps.get(0).getRole());
    }
}
