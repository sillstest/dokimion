package com.testquack.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.testquack.beans.Filter;
import com.testquack.beans.TestcaseSizes;
import com.testquack.dal.OrganizationRepository;
import com.testquack.services.errors.EntityAccessDeniedException;
import com.testquack.services.errors.EntityValidationException;
import com.testquack.services.errors.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.testquack.dal.CommonRepository;
import com.testquack.dal.DokimionLogger;
import com.testquack.dal.TestcaseSizesRepository;
import ru.greatbit.utils.string.StringUtils;
import ru.greatbit.whoru.auth.Session;

import java.security.NoSuchAlgorithmException;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

import static java.lang.String.format;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@Service
public class TestcaseSizesService extends BaseService<TestcaseSizes> {

    @Autowired
    private TestcaseSizesRepository repository;

    @Override
    protected CommonRepository<TestcaseSizes> getRepository() {
        return repository;
    }

    @Override
    public List<TestcaseSizes> findFiltered(Session session, String projectId, Filter filter) {
DokimionLogger.info("TestcaseSizesService.findFiltered - session: " + session);
DokimionLogger.info("TestcaseSizesService.findFiltered - projectId: " + projectId);
DokimionLogger.info("TestcaseSizesService.findFiltered - filter: " + filter);
        List<TestcaseSizes> listTCSizes = getRepository().find(getCurrOrganizationId(session), projectId, filter);
        for (TestcaseSizes tcSize : listTCSizes) {
           DokimionLogger.info("TestcaseSizesService::findFiltered - tcSize: " + tcSize);
        }
        return listTCSizes;

        //return getRepository().find(getCurrOrganizationId(session), projectId, filter);
    }


    public List<TestcaseSizes> findAll() {

DokimionLogger.info("TestcaseSizesService::findAll");

        List<TestcaseSizes> tcSizesList = StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
        for (TestcaseSizes tcSize : tcSizesList) {
           DokimionLogger.info("TestcaseSizesService.findAll() - tcSize: " + tcSize);
        }


        return tcSizesList;
        //return StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
    }



}
