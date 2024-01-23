package com.testquack.dal;

import org.springframework.data.repository.PagingAndSortingRepository;
import com.testquack.beans.TestcaseSizes;

public interface TestcaseSizesRepository extends TestcaseSizesRepositoryCustom,
        PagingAndSortingRepository<TestcaseSizes, String>, CommonRepository<TestcaseSizes> {
}
