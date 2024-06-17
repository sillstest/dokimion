package com.testquack.dal;

import com.testquack.dal.Logger;
import org.junit.Before;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import com.testquack.beans.Filter;
import com.testquack.beans.Order;
import com.testquack.beans.TestcaseSizes;

import java.util.List;

import static java.util.stream.Collectors.toList;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.is;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThat;

public class TestcaseSizesRepositoryTest extends DalBaseTest {

    @Autowired
    private TestcaseSizesRepository tcSizesRepo;

    @Autowired
    private MongoOperations mongoOperations;

    @Before
    public void setUp(){
        mongoOperations.dropCollection("TestcaseSizes");
    }

    @Test
    public void tcSizesSaveTest(){
        TestcaseSizes tcsSizes = tcSizesRepo.save(new TestcaseSizes());

        assertNotNull(tcsSizes.getId());

        TestcaseSizes tcSizesFetched = tcSizesRepo.findById(tcsSizes.getId()).get();
        assertNotNull(tcSizesFetched);
        assertThat(tcSizesFetched.getName(), is(tcsSizes.getName()));

    }

    @Test
    public void findFilteredSingleFieldTest(){
       tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("medium"));

       List<TestcaseSizes> tcSizes = tcSizesRepo.find(
                null,
                null,
                new Filter().withField("small")
       );
       assertThat(tcSizes.size(), is(0));

       for (TestcaseSizes tcSize : tcSizes ) {
          Logger.info("findFilteredSingleFieldTest - name: " + tcSize.getName());
       }
    }

    @Test
    public void findFilteredMultipleValuesFieldTest(){

        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("small"));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("medium"));


        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                     withField("small").
                     withField("medium")
        );
        assertThat(tcSizes.size(), is(0));

       for (TestcaseSizes tcSize : tcSizes ) {
          Logger.info("findFilteredMultipleValuesFieldTest: " + tcSize.getName());
       }


    }

    @Test
    public void findFilteredMultipleFieldTest(){

        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("small"));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("medium"));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("large"));


        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                      withField("large").
                      withField("medium").
                      withField("small")
        );

        assertThat(tcSizes.size(), is(0));
    }

    @Test
    public void findOrderedTest(){

        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("small"));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("medium"));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("large"));

        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
                null,
                null,
                new Filter().
                        withSortField("small")
        );

        assertThat(tcSizes.size(), is(3));
        assertThat(tcSizes.stream().map(TestcaseSizes::getName).collect(toList()),
                contains("small", "medium", "large"));

        tcSizes = tcSizesRepo.find(
                null,
                null,
                new Filter().
                        withSortField("small").withOrder(Order.DESC)
        );
       
        assertThat(tcSizes.size(), is(3));
        assertThat(tcSizes.stream().map(TestcaseSizes::getName).collect(toList()),
                contains("small", "medium", "large"));

    }

    @Test
    public void findLimitedFieldsTest(){
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withName("medium"));

        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                     withExcludedField("medium")
        );

        assertThat(tcSizes.size(), is(1));
        assertThat(tcSizes.get(0).getName(), is("medium"));
        assertNotNull(tcSizes.get(0).getName());

        tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                     withIncludedField("medium")
        );

        assertThat(tcSizes.size(), is(1));
        assertNull(tcSizes.get(0).getName());
    }
}
