package com.testquack.dal;

import org.junit.Before;
import org.junit.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoOperations;
import com.testquack.beans.Filter;
import com.testquack.beans.Order;
import com.testquack.beans.TestcaseSizes;
import com.testquack.beans.Small;
import com.testquack.beans.Medium;
import com.testquack.beans.Large;

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
        TestcaseSizes tcsSmallMin = tcSizesRepo.save(new TestcaseSizes().withSmall(new Small().withMinLines(0)));
        TestcaseSizes tcsSmallMax = tcSizesRepo.save(new TestcaseSizes().withSmall(new Small().withMaxLines(25)));
        TestcaseSizes tcsMediumMin = tcSizesRepo.save(new TestcaseSizes().withMedium(new Medium().withMinLines(26)));
        TestcaseSizes tcsMediumMax = tcSizesRepo.save(new TestcaseSizes().withMedium(new Medium().withMaxLines(50)));
        TestcaseSizes tcsLargeMin = tcSizesRepo.save(new TestcaseSizes().withLarge(new Large().withMinLines(51)));
        TestcaseSizes tcsLargeMax = tcSizesRepo.save(new TestcaseSizes().withLarge(new Large().withMaxLines(51)));

        assertNotNull(tcsSmallMin.getId());
        assertNotNull(tcsSmallMax.getId());
        assertNotNull(tcsMediumMin.getId());
        assertNotNull(tcsMediumMax.getId());
        assertNotNull(tcsLargeMin.getId());
        assertNotNull(tcsLargeMax.getId());

        TestcaseSizes tcSizesFetched = tcSizesRepo.findById(tcsSmallMin.getId()).get();
        assertNotNull(tcSizesFetched);
        assertThat(tcSizesFetched.getSmall(), is(tcsSmallMin.getSmall()));

        tcSizesFetched = tcSizesRepo.findById(tcsSmallMax.getId()).get();
        assertNotNull(tcSizesFetched);
        assertThat(tcSizesFetched.getSmall(), is(tcsSmallMax.getSmall()));

        tcSizesFetched = tcSizesRepo.findById(tcsMediumMin.getId()).get();
        assertNotNull(tcSizesFetched);
        assertThat(tcSizesFetched.getMedium(), is(tcsMediumMin.getMedium()));

        tcSizesFetched = tcSizesRepo.findById(tcsMediumMax.getId()).get();
        assertNotNull(tcSizesFetched);
        assertThat(tcSizesFetched.getMedium(), is(tcsMediumMax.getMedium()));

        tcSizesFetched = tcSizesRepo.findById(tcsLargeMin.getId()).get();
        assertNotNull(tcSizesFetched);
        assertThat(tcSizesFetched.getLarge(), is(tcsLargeMin.getLarge()));

        tcSizesFetched = tcSizesRepo.findById(tcsLargeMax.getId()).get();
        assertNotNull(tcSizesFetched);
        assertThat(tcSizesFetched.getLarge(), is(tcsLargeMax.getLarge()));
    }

    @Test
    public void findFilteredSingleFieldTest(){
       tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withSmall(new Small().withMinLines(0)));
       tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withSmall(new Small().withMaxLines(25)));

       List<TestcaseSizes> tcSizes = tcSizesRepo.find(
                null,
                null,
                new Filter().
                  withField("small", new Small().withMinLines(0)).
                  withField("small", new Small().withMaxLines(25))
       );
       assertThat(tcSizes.size(), is(0));
       assertThat(tcSizes.get(0).getSmall(), is(new Small().withMinLines(0)));
       assertThat(tcSizes.get(0).getSmall(), is(new Small().withMaxLines(25)));

       for (TestcaseSizes tcSize : tcSizes ) {
          System.out.println("findFilteredSingleFieldTest - small min: " + tcSize.getSmall().withMinLines(0));
          System.out.println("findFilteredSingleFieldTest - small max: " + tcSize.getSmall().withMaxLines(0));
          System.out.flush();
       }
    }

    @Test
    public void findFilteredMultipleValuesFieldTest(){

        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withMedium(new Medium().withMinLines(0)));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withMedium(new Medium().withMinLines(10)));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withMedium(new Medium().withMinLines(25)));


        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                     withField("medium", new Medium().withMinLines(30)).
                     withField("medium", new Medium().withMaxLines(55))
        );
        assertThat(tcSizes.size(), is(2));
        assertThat(tcSizes.stream().map(TestcaseSizes::getMedium).
                collect(toList()),
                containsInAnyOrder(new Medium().withMinLines(30),
                                   new Medium().withMinLines(50)));

       for (TestcaseSizes tcSize : tcSizes ) {
          System.out.println("findFilteredMultipleValuesFieldTest medium min: " + tcSize.getMedium().withMinLines(30));
          System.out.println("findFilteredMultipleValuesFieldTest medium max: " + tcSize.getMedium().withMaxLines(60));
          System.out.flush();
       }


    }

    @Test
    public void findFilteredMultipleFieldTest(){

        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withLarge(new Large().withMinLines(55).withMaxLines(99)));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withLarge(new Large().withMinLines(22).withMaxLines(88)));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withLarge(new Large().withMinLines(10).withMaxLines(55)));


        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                      withField("Large", new Large().withMinLines(44)).
                      withField("Medium", new Medium().withMaxLines(66)).
                      withField("Small", new Small().withMinLines(22))
        );

        assertThat(tcSizes.size(), is(1));
        assertThat(tcSizes.get(0).getLarge(), is(new Large().withMinLines(22)));
    }

    @Test
    public void findOrderedTest(){

        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withSmall(new Small().withMinLines(0)));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withSmall(new Small().withMinLines(25)));
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withSmall(new Small().withMinLines(55)));

        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
                null,
                null,
                new Filter().
                        withSortField("small")
        );

        assertThat(tcSizes.size(), is(3));
        assertThat(tcSizes.stream().map(TestcaseSizes::getSmall).collect(toList()),
                contains(new Small().withMinLines(0), new Small().withMinLines(25), new Small().withMinLines(55)));

        tcSizes = tcSizesRepo.find(
                null,
                null,
                new Filter().
                        withSortField("small").withOrder(Order.DESC)
        );
       
        assertThat(tcSizes.size(), is(3));
        assertThat(tcSizes.stream().map(TestcaseSizes::getSmall).collect(toList()),
                contains(new Small().withMinLines(0), new Small().withMinLines(22), new Small().withMinLines(55)));

    }

    @Test
    public void findLimitedFieldsTest(){
        tcSizesRepo.save(null, "TestcaseSizes", new TestcaseSizes().withMedium(new Medium().withMaxLines(99).withMinLines(33)));

        List<TestcaseSizes> tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                     withExcludedField("medium")
        );

        assertThat(tcSizes.size(), is(1));
        assertThat(tcSizes.get(0).getMedium(), is(new Medium().withMaxLines(44)));
        assertNull(tcSizes.get(0).getMedium());

        tcSizes = tcSizesRepo.find(
             null,
             null,
             new Filter().
                     withIncludedField("medium")
        );

        assertThat(tcSizes.size(), is(1));
        assertThat(tcSizes.get(0).getMedium(), is(new Medium().withMaxLines(55)));
        assertNull(tcSizes.get(0).getMedium());
    }
}
