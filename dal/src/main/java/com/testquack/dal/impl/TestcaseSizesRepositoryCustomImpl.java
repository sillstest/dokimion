package com.testquack.dal.impl;

import com.testquack.dal.Logger;
import com.testquack.beans.TestcaseSizes;
import com.testquack.dal.TestcaseSizesRepositoryCustom;

import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;

import static org.apache.commons.lang3.StringUtils.isEmpty;

import java.util.List;

public class TestcaseSizesRepositoryCustomImpl extends CommonRepositoryImpl<TestcaseSizes>
        implements TestcaseSizesRepositoryCustom {

    @Override
    public Class getEntityClass() {
        return TestcaseSizes.class;
    }

    @Override
    protected String getCollectionName(String organizationId, String projectId) {
        //return isEmpty(organizationId) ? "TestcaseSizes" : organizationId + "_testcaseSizes";

        String collName = isEmpty(organizationId) ? "TestcaseSizes" : organizationId + "_testcaseSizes";

Logger.info("TestcaseSizesRepositoryCustomImpl::getCollectionName - " + collName);
        return collName;
    }

    @Override
    public List<TestcaseSizes> suggestTestcaseSizes(String organizationId, String literal) {
Logger.info("TestcaseSizesRepositoryCustomImpl::suggestTestcaseSizes");
        Criteria criteria = new Criteria();
        criteria.orOperator(
                Criteria.where("small").regex(literal, "i"),
                Criteria.where("medium").regex(literal, "i"),
                Criteria.where("large").regex(literal, "i")
        );
        Query query = new Query(criteria);
        query.limit(20);
        return mongoOperations.find(query, TestcaseSizes.class, getCollectionName(organizationId, null));
    }

}
