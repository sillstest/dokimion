package com.testquack.dal;

import org.junit.Before;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import com.testquack.beans.Filter;
import com.testquack.beans.Order;
import com.testquack.beans.DefaultProjectAttributes;
import com.testquack.beans.Role;
import com.testquack.beans.Capability;

import java.util.List;
import java.util.ArrayList;

import static java.util.stream.Collectors.toList;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThat;

public class DefaultProjectAttributesRepositoryTest extends DalBaseTest {

    @Autowired
    private DefaultProjectAttributesRepository defaultProjAttribsRepo;

    @Autowired
    private MongoOperations mongoOperations;

    @Before
    public void setUp(){
        mongoOperations.dropCollection("DefaultProjectAttributes");
    }

    @Test
    public void defaultprojattribsSaveTest(){
        DefaultProjectAttributes defaultProjAttribs = defaultProjAttribsRepo.save(new DefaultProjectAttributes().withProject("paratext"));
        assertNotNull(defaultProjAttribs.getId());

        DefaultProjectAttributes defaultProjAttribsFetched = defaultProjAttribsRepo.findById(defaultProjAttribs.getId()).get();
        assertNotNull(defaultProjAttribsFetched);
        assertThat(defaultProjAttribsFetched.getProject(), is(defaultProjAttribs.getProject()));
    }

    @Test
    public void findFilteredSingleFieldTest(){
       defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withProject("paratext"));
       List<DefaultProjectAttributes> defaultProjAttribss = defaultProjAttribsRepo.find(
                null,
                null,
                new Filter().withField("project", "paratext")
       );
       assertThat(defaultProjAttribss.size(), is(1));
       assertThat(defaultProjAttribss.get(0).getProject(), is("paratext"));

       for (DefaultProjectAttributes defaultProjAttribs : defaultProjAttribss ) {
          System.out.println("findFilteredSingleFieldTest - project: " + defaultProjAttribs.getProject());
          System.out.flush();
       }
    }

    @Test
    public void findFilteredMultipleValuesFieldTest(){

        ArrayList<String> fr = new ArrayList<String>();
        fr.add("Full Regression");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withAttributes(fr));
        ArrayList<String> am = new ArrayList<String>();
        am.add("Manual");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withAttributes(am));


        List<DefaultProjectAttributes> defaultProjAttribss = defaultProjAttribsRepo.find(
             null,
             null,
             new Filter().
                     withField("attributes","Full Regression").
                     withField("attributes", "Manual")
        );
        assertThat(defaultProjAttribss.size(), is(2));
        assertThat(defaultProjAttribss.stream().map(DefaultProjectAttributes::getAttributes).collect(toList()),
                containsInAnyOrder("Full Regression", "Manual"));

       for (DefaultProjectAttributes defaultProjAttribs : defaultProjAttribss ) {
          System.out.println("findFilteredMultipleValuesFieldTest attribs: " + defaultProjAttribs.getAttributes());
          System.out.flush();
       }


    }

    @Test
    public void findFilteredMultipleFieldTest(){

        ArrayList<String> fr = new ArrayList<String>();
        fr.add("Full Regression");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withProject("paratext").withAttributes(fr));

        ArrayList<String> all = new ArrayList<String>();
        all.add("All");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withProject("paratext").withAttributes(all));

        List<DefaultProjectAttributes> defaultProjAttribss = defaultProjAttribsRepo.find(
             null,
             null,
             new Filter().
                      withField("project", "paratext").
                      withField("attributes", all)
        );

        assertThat(defaultProjAttribss.size(), is(2));
        assertThat(defaultProjAttribss.get(0).getAttributes(), is(all));
    }

    @Test
    public void findOrderedTest(){

        ArrayList<String> fr = new ArrayList<String>();
        fr.add("Full Regression");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withAttributes(fr));

        ArrayList<String> m = new ArrayList<String>();
        m.add("Manual");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withAttributes(m));

        ArrayList<String> all = new ArrayList<String>();
        all.add("All");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withAttributes(all));

        List<DefaultProjectAttributes> defaultProjAttribss = defaultProjAttribsRepo.find(
                null,
                null,
                new Filter().
                        withSortField("attributes")
        );

        assertThat(defaultProjAttribss.size(), is(3));
        assertThat(defaultProjAttribss.stream().map(DefaultProjectAttributes::getAttributes).collect(toList()),
                contains(fr, m, all));

        defaultProjAttribss = defaultProjAttribsRepo.find(
                null,
                null,
                new Filter().
                        withSortField("attributes").withOrder(Order.DESC)
        );
       
        assertThat(defaultProjAttribss.size(), is(3));
        assertThat(defaultProjAttribss.stream().map(DefaultProjectAttributes::getAttributes).collect(toList()),
                contains(fr, m, all));

    }

    @Test
    public void findLimitedFieldsTest(){
        ArrayList<String> fr = new ArrayList<String>();
        fr.add("Full Regression");
        defaultProjAttribsRepo.save(null, "DefaultProjectAttributes", new DefaultProjectAttributes().withAttributes(fr).withProject("paratext"));

        List<DefaultProjectAttributes> defaultProjAttribss = defaultProjAttribsRepo.find(
             null,
             null,
             new Filter().
                     withExcludedField("attributes")
        );

        assertThat(defaultProjAttribss.size(), is(1));
        assertThat(defaultProjAttribss.get(0).getAttributes(), is(fr));
        assertNull(defaultProjAttribss.get(0).getProject());

        defaultProjAttribss = defaultProjAttribsRepo.find(
             null,
             null,
             new Filter().
                     withIncludedField("capability")
        );

        assertThat(defaultProjAttribss.size(), is(1));
        assertThat(defaultProjAttribss.get(0).getAttributes(), is(fr));
        assertNull(defaultProjAttribss.get(0).getProject());
    }
}
