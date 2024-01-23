package com.testquack.dal;

import com.testquack.beans.TestcaseSizes;

import java.util.List;

public interface TestcaseSizesRepositoryCustom {

    public List<TestcaseSizes> suggestTestcaseSizes(String organizationId, String literal);

}
