﻿angular.module('umbraco.directives').directive('umbracoBookshelfMarkedUp', function ($location, $routeParams) {

    function getCurrentRelativePath(isViewingFile, pathOnFileSystemSections) {
        var relativePathSections = [];

        var size = (isViewingFile) ? 2 : 1;

        for (var i = 1; i <= pathOnFileSystemSections.length - size; i++) {
            relativePathSections.push(pathOnFileSystemSections[i]);
        }

        var relativePath = relativePathSections.join('/');

        return "/" + relativePath + "/";
    }

    function getRootRelativePath(pathOnFileSystemSections) {
        return "/" + pathOnFileSystemSections[1] + "/" + pathOnFileSystemSections[2];
    }

    function inArray(array, item) {
        var foundItem = _.find(array, function (arrayItem) { return arrayItem == item; });
        return (foundItem != undefined);
    }

    function isRelative($element, attribute) {
        return (!isExternal($element, attribute) && $element.attr(attribute).indexOf('/') != 0);
    }

    function isExternal($element, attribute) {
        return $element.attr(attribute).indexOf('http') == 0;
    }

    var linker = function (scope, element, attrs) {
        scope.$watch('model.content', function (newValue, oldValue) {

            //not sure why, but the urls are double encoded
            var url = decodeURIComponent($location.url());
            var isViewingFile = (url.indexOf('/file/') != -1);
            var pathToFileUrl = "/umbraco/#/UmbracoBookshelf/UmbracoBookshelfTree/file/";
            var pathToFolderUrl = "/umbraco/#/UmbracoBookshelf/UmbracoBookshelfTree/folder/";
            var pathOnFileSystem = decodeURIComponent($routeParams.id);
            var pathOnFileSystemSections = pathOnFileSystem.split('/');

            if (newValue) {
                var markup = element.html(marked(newValue));

                /* handle links */
                markup.find('a').each(function () {
                    var $a = $(this);
                    var href = $a.attr('href');
                    var relativePath = "";

                    if (isExternal($a, 'href')) {
                        $a.attr('target', '_blank');
                    }
                    else if (href.indexOf("/umbraco/#/UmbracoBookshelf") == 0) {
                        //allow as-is
                    }
                    else {
                        if (isRelative($a, 'href')) {
                            //is relative to current
                            relativePath = getCurrentRelativePath(isViewingFile, pathOnFileSystemSections);
                        } else {
                            //is relative to root
                            relativePath = getRootRelativePath(pathOnFileSystemSections);
                        }

                        var extension = href.split('.').pop();

                        //test for media downloads
                        if (inArray(scope.config.mediaExtensions, "." + extension)) {
                            $a.attr('href', relativePath + href);
                            $a.attr('target', '_blank');
                        } else {
                            var pathToLinkedFileOrFolder = (extension.indexOf("/") == -1) ? pathToFileUrl : pathToFolderUrl;

                            $a.attr('href', pathToLinkedFileOrFolder + encodeURIComponent(encodeURIComponent(relativePath + href)));
                        }
                    }
                });

                /* fixup image relative paths */
                markup.find('img').each(function () {
                    var $img = $(this);
                    var relativePath = "";

                    if (isRelative($img, 'src')) {
                        //is relative to current
                        relativePath = getCurrentRelativePath(isViewingFile, pathOnFileSystemSections);
                    } else {
                        //is relative to root
                        relativePath = getRootRelativePath(pathOnFileSystemSections);
                    }
                    $img.attr('src', relativePath + $img.attr('src'));
                });
            }
        }, true);
    }

    return {
        restrict: "A",
        link: linker
    }
})