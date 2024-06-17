package com.testquack.services;

import com.testquack.beans.Filter;
import com.testquack.beans.TestcaseSizes;
import com.testquack.dal.OrganizationRepository;
import com.testquack.services.errors.EntityAccessDeniedException;
import com.testquack.services.errors.EntityValidationException;
import com.testquack.services.errors.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.testquack.dal.Logger;
import com.testquack.dal.CommonRepository;
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
Logger.info("TestcaseSizesService.findFiltered - session: " + session);
Logger.info("TestcaseSizesService.findFiltered - projectId: " + projectId);
Logger.info("TestcaseSizesService.findFiltered - filter: " + filter);
        List<TestcaseSizes> listTCSizes = getRepository().find(getCurrOrganizationId(session), projectId, filter);
        for (TestcaseSizes tcSize : listTCSizes) {
           Logger.info("TestcaseSizesService::findFiltered - tcSize: " + tcSize);
        }
        return listTCSizes;

        //return getRepository().find(getCurrOrganizationId(session), projectId, filter);
    }


    public List<TestcaseSizes> findAll() {

Logger.info("TestcaseSizesService::findAll");

        List<TestcaseSizes> tcSizesList = StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
        for (TestcaseSizes tcSize : tcSizesList) {
           Logger.info("TestcaseSizesService.findAll() - tcSize: " + tcSize);
        }


        return tcSizesList;
        //return StreamSupport.stream(repository.findAll().spliterator(), false).collect(Collectors.toList());
    }



}
